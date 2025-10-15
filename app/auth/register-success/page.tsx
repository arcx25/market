import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>Please verify your email to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Check your inbox</p>
                <p className="text-muted-foreground">
                  We've sent a verification email. Click the link to activate your account.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>After verifying your email, you can:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Log in using PGP challenge-response authentication</li>
                <li>Browse the marketplace as a buyer</li>
                <li>Upgrade to seller status for 1000 USD in XMR</li>
              </ul>
            </div>

            <Button asChild className="w-full">
              <Link href="/auth/pgp-login">Continue to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
