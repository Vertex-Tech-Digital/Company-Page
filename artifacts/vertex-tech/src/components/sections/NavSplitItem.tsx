import { useState } from "react";
import { ArrowUpRight, ChevronDown, Home, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";

export type NavSection = "blog" | "diagnostico";

interface NavSplitItemProps {
  id: NavSection;
  active: boolean;
  onLabel: () => void;
  onSection: () => void;
  onPage: () => void;
}

interface MenuOptionProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  onSelect: () => void;
  testId: string;
}

function MenuOption({
  icon: Icon,
  title,
  desc,
  onSelect,
  testId,
}: MenuOptionProps) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 outline-none transition-colors data-[highlighted]:bg-white/5"
      data-testid={testId}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
          {desc}
        </span>
      </span>
    </DropdownMenuItem>
  );
}

/**
 * Ítem de navegación con doble destino.
 *
 * El texto sigue siendo un enlace normal (sección del home) y la pleca es un
 * botón hermano que abre un menú con la sección resumen y la página completa.
 * Nunca se anida un botón dentro de un enlace: son dos zonas clicables
 * independientes.
 */
export function NavSplitItem({
  id,
  active,
  onLabel,
  onSection,
  onPage,
}: NavSplitItemProps) {
  const { t } = useLanguage();

  return (
    <div
      className="group/split relative inline-flex items-center"
      data-testid={`nav-split-${id}`}
    >
      <a
        href={`#${id}`}
        onClick={(event) => {
          event.preventDefault();
          onLabel();
        }}
        className={`text-[13px] font-medium transition-colors hover:text-white xl:text-sm ${
          active ? "font-semibold text-primary" : "text-slate-300"
        }`}
        aria-current={active ? "true" : undefined}
        data-testid={`nav-link-${id}`}
      >
        {t(`nav.${id}`)}
      </a>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t(`nav.${id}.more`)}
            className={`group ml-0.5 inline-flex h-8 w-6 items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? "text-primary/80 group-hover/split:text-primary data-[state=open]:text-primary"
                : "text-slate-500 group-hover/split:text-white data-[state=open]:text-primary"
            }`}
            data-testid={`nav-split-${id}-trigger`}
          >
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={24}
          className="z-[60] w-72 rounded-xl border border-white/10 bg-slate-950/95 p-2 text-slate-200 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <MenuOption
            icon={Home}
            title={t(`nav.${id}.section`)}
            desc={t(`nav.${id}.sectionDesc`)}
            onSelect={onSection}
            testId={`nav-submenu-${id}-section`}
          />
          <DropdownMenuSeparator className="my-1 bg-white/10" />
          <MenuOption
            icon={ArrowUpRight}
            title={t(`nav.${id}.all`)}
            desc={t(`nav.${id}.allDesc`)}
            onSelect={onPage}
            testId={`nav-submenu-${id}-all`}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Variante móvil: acordeón inline. Sin hover y sin paneles flotantes; el ítem
 * principal navega y la pleca despliega las dos opciones con área táctil 44px.
 */
export function NavMobileSplitItem({
  id,
  active,
  onLabel,
  onSection,
  onPage,
}: NavSplitItemProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const panelId = `nav-mobile-${id}-submenu`;

  return (
    <div data-testid={`nav-split-${id}-mobile`}>
      <div className="flex items-center gap-1">
        <a
          href={`#${id}`}
          onClick={(event) => {
            event.preventDefault();
            onLabel();
          }}
          className={`flex min-h-[44px] flex-1 items-center text-lg font-medium transition-colors ${
            active
              ? "font-semibold text-primary"
              : "text-slate-300 hover:text-white"
          }`}
          aria-current={active ? "true" : undefined}
          data-testid={`nav-link-${id}-mobile`}
        >
          {t(`nav.${id}`)}
        </a>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t(`nav.${id}.more`)}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            open
              ? "text-primary"
              : "text-slate-400 hover:text-white active:text-white"
          }`}
          data-testid={`nav-split-${id}-trigger-mobile`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-150 motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        <div
          id={panelId}
          data-testid={panelId}
          className="ml-1 mt-1 flex flex-col border-l border-white/10 pl-3"
        >
          <a
            href={`#${id}`}
            onClick={(event) => {
              event.preventDefault();
              onSection();
            }}
            className="flex min-h-[44px] items-start gap-3 rounded-lg py-2.5 pr-2 text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            data-testid={`nav-submenu-${id}-section-mobile`}
          >
            <Home
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              <span className="block text-base font-medium">
                {t(`nav.${id}.section`)}
              </span>
              <span className="block text-xs text-slate-500">
                {t(`nav.${id}.sectionDesc`)}
              </span>
            </span>
          </a>

          <a
            href={`/${id}`}
            onClick={(event) => {
              event.preventDefault();
              onPage();
            }}
            className="flex min-h-[44px] items-start gap-3 rounded-lg py-2.5 pr-2 text-slate-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            data-testid={`nav-submenu-${id}-all-mobile`}
          >
            <ArrowUpRight
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              <span className="block text-base font-medium">
                {t(`nav.${id}.all`)}
              </span>
              <span className="block text-xs text-slate-500">
                {t(`nav.${id}.allDesc`)}
              </span>
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
