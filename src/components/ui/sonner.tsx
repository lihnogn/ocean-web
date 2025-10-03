import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-gradient-to-r group-[.toast]:from-cyan-200/30 group-[.toast]:via-blue-300/35 group-[.toast]:to-purple-300/40 group-[.toast]:text-cyan-50 group-[.toast]:border group-[.toast]:border-cyan-200/40 group-[.toast]:backdrop-blur-sm group-[.toast]:hover:from-cyan-100/40 group-[.toast]:hover:via-blue-200/45 group-[.toast]:hover:to-purple-200/50 group-[.toast]:transition-all group-[.toast]:duration-300",
          cancelButton: "group-[.toast]:bg-gradient-to-r group-[.toast]:from-slate-200/30 group-[.toast]:via-gray-300/25 group-[.toast]:to-zinc-300/30 group-[.toast]:text-slate-600 group-[.toast]:border group-[.toast]:border-slate-200/40 group-[.toast]:backdrop-blur-sm group-[.toast]:hover:from-slate-100/40 group-[.toast]:hover:via-gray-200/35 group-[.toast]:hover:to-zinc-200/40 group-[.toast]:transition-all group-[.toast]:duration-300",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
