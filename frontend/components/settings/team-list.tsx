"use client"

import { MOCK_MEMBERS } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Plus, Shield, User } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TeamList() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        Manage who has access to this workspace.
                    </CardDescription>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_MEMBERS.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="flex items-center gap-3 font-medium">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={member.picture_url || ""} />
                                        <AvatarFallback>
                                            {member.full_name?.slice(0, 2).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span>{member.full_name || "Unknown"}</span>
                                        <span className="text-xs text-muted-foreground font-normal">{member.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {member.role === "Admin" || member.role === "Owner" ? (
                                            <Shield className="h-3 w-3 text-blue-500" />
                                        ) : (
                                            <User className="h-3 w-3 text-gray-500" />
                                        )}
                                        {member.role}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.status === "Active" ? "default" : "secondary"}>
                                        {member.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Remove from Team</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
