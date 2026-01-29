"""
Validator Service: Ensures 100% accuracy by validating numeric claims.

Purpose:
- Extract all numbers from insight descriptions
- Cross-check against source metrics
- Flag mismatches and trigger fallback templates
- Prevent LLM hallucinations from reaching users
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from loguru import logger


@dataclass
class ValidationResult:
    """Result of insight validation"""
    passed: bool
    error: Optional[str] = None
    hallucinated_numbers: List[float] = None
    matched_numbers: List[float] = None
    
    def __post_init__(self):
        if self.hallucinated_numbers is None:
            self.hallucinated_numbers = []
        if self.matched_numbers is None:
            self.matched_numbers = []


class ValidatorService:
    """
    Validates numeric claims in insight descriptions against source metrics.
    
    Tolerance: ±1% for rounding errors
    """
    
    # Regex patterns for number extraction
    CURRENCY_PATTERN = r'\$?₹?€?[\d,]+\.?\d*'
    PERCENTAGE_PATTERN = r'[\d,]+\.?\d*%'
    NUMBER_PATTERN = r'[\d,]+\.?\d*'
    
    def extract_numbers(self, text: str) -> List[float]:
        """
        Extract all numbers from text.
        
        Examples:
        - "$12,500" → 12500.0
        - "45%" → 45.0
        - "3.5x" → 3.5
        """
        numbers = []
        
        # Find all number-like patterns
        patterns = [self.CURRENCY_PATTERN, self.PERCENTAGE_PATTERN, self.NUMBER_PATTERN]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # Clean and convert
                cleaned = match.replace('$', '').replace('₹', '').replace('€', '').replace(',', '').replace('%', '')
                try:
                    numbers.append(float(cleaned))
                except ValueError:
                    continue
        
        # Remove duplicates and sort
        return sorted(list(set(numbers)))
    
    def validate_insight(
        self, 
        description: str, 
        source_metrics: Dict[str, Any],
        tolerance: float = 0.01
    ) -> ValidationResult:
        """
        Validate that all numbers in description exist in source_metrics.
        
        Args:
            description: Insight description text
            source_metrics: Dictionary of source metrics (from insight.meta)
            tolerance: Acceptable variance (default 1%)
        
        Returns:
            ValidationResult with pass/fail status
        """
        text_numbers = self.extract_numbers(description)
        
        # Extract all numeric values from source metrics (recursive)
        source_numbers = self._extract_source_numbers(source_metrics)
        
        if not text_numbers:
            # No numbers to validate
            return ValidationResult(passed=True)
        
        hallucinated = []
        matched = []
        
        for num in text_numbers:
            # Check if this number exists in source (within tolerance)
            found = False
            for src in source_numbers:
                if src == 0:
                    # Exact match required for zero
                    if num == 0:
                        found = True
                        matched.append(num)
                        break
                else:
                    # Percentage tolerance
                    variance = abs(num - src) / abs(src)
                    if variance <= tolerance:
                        found = True
                        matched.append(num)
                        break
            
            if not found:
                hallucinated.append(num)
        
        if hallucinated:
            logger.warning(
                f"Validation failed: Numbers {hallucinated} not found in source metrics",
                extra={"text_numbers": text_numbers, "source_numbers": source_numbers[:10]}
            )
            return ValidationResult(
                passed=False,
                error=f"Numbers {hallucinated} not found in source metrics",
                hallucinated_numbers=hallucinated,
                matched_numbers=matched
            )
        
        return ValidationResult(
            passed=True,
            matched_numbers=matched
        )
    
    def _extract_source_numbers(self, obj: Any, numbers: List[float] = None) -> List[float]:
        """
        Recursively extract all numeric values from nested dict/list.
        """
        if numbers is None:
            numbers = []
        
        if isinstance(obj, (int, float)):
            numbers.append(float(obj))
        elif isinstance(obj, dict):
            for value in obj.values():
                self._extract_source_numbers(value, numbers)
        elif isinstance(obj, list):
            for item in obj:
                self._extract_source_numbers(item, numbers)
        
        return numbers
    
    def calculate_confidence(self, validation: ValidationResult) -> str:
        """
        Calculate confidence level based on validation result.
        
        Returns: "high", "medium", or "low"
        """
        if not validation.passed:
            return "low"
        
        if len(validation.matched_numbers) >= 3:
            return "high"
        elif len(validation.matched_numbers) >= 1:
            return "medium"
        else:
            return "medium"  # No numbers to validate


# Singleton instance
validator_service = ValidatorService()
