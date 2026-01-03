"use client"

import { useState } from "react"
import { MOCK_COMPANY_SETTINGS } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Building2, Globe, RefreshCcw, Save } from "lucide-react"

export function CompanyForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: MOCK_COMPANY_SETTINGS.name,
        website: MOCK_COMPANY_SETTINGS.website,
        industry: MOCK_COMPANY_SETTINGS.industry,
        support_email: MOCK_COMPANY_SETTINGS.support_email
    })

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Brand Profile</CardTitle>
                    <CardDescription>
                        Manage your D2C brand's public identity and preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 rounded-lg border">
                            <AvatarImage src={MOCK_COMPANY_SETTINGS.logo_url} alt={formData.name} />
                            <AvatarFallback className="rounded-lg">{getInitials(formData.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <Button variant="outline" size="sm" type="button">
                                Change Logo
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Recommended 400x400px.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Brand Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Industry</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            >
                                <option value="Fashion & Apparel">Fashion & Apparel</option>
                                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Food & Beverage">Food & Beverage</option>
                                <option value="Home & Living">Home & Living</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Support Email</label>
                            <Input
                                value={formData.support_email}
                                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Base Currency</label>
                            <Input value={MOCK_COMPANY_SETTINGS.currency} disabled className="bg-muted" />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Timezone</label>
                            <Input value={MOCK_COMPANY_SETTINGS.timezone} disabled className="bg-muted" />
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
                    <div className="text-xs text-muted-foreground">
                        Company ID: <span className="font-mono text-xs">{MOCK_COMPANY_SETTINGS.id}</span>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-red-100 dark:border-red-900/20">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions for your company workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium">Delete Company</h4>
                            <p className="text-sm text-muted-foreground">
                                Permanently remove your brand and all data.
                            </p>
                        </div>
                        <Button variant="destructive">Delete Company</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
