import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StackCheck = {
  name: string;
  status: "ok";
};

const STACK_CHECKS: StackCheck[] = [
  { name: "Next.js", status: "ok" },
  { name: "Tailwind CSS", status: "ok" },
  { name: "shadcn/ui", status: "ok" },
  { name: "TypeScript", status: "ok" },
];

export default function Home(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Learning System</CardTitle>
          <CardDescription>
            Foundation check — every item below proves one part of the stack renders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {STACK_CHECKS.map((check) => (
              <li key={check.name}>
                <Badge variant="secondary">
                  {check.name}: {check.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button type="button">Foundation ready</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
