import React, { useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SelectStringValue<T extends string>({
  id,
  values: values,
  onSelect,
  value,
  labelRenderer,
  disabled,
  className,
  disabledValue
}: {
  id?: string;
  values?: T[];
  value?: T;
  onSelect?: (value?: T) => void;
  labelRenderer?: (value: T) => React.ReactNode;
  disabled?: boolean;
  className?: string;
  disabledValue?: (value: T) => boolean;
}) {
  const [selected, setSelected] = React.useState<T | undefined>(value);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  return (
    <Select
      value={selected}
      onValueChange={(value: T) => {
        setSelected(value);
        onSelect && onSelect(value);
      }}
    >
      <SelectTrigger className={cn("text-left", className)} disabled={disabled} id={id}>
        <SelectValue placeholder="Select value" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {values?.map(value => (
            <SelectItem
              key={value}
              value={value}
              disabled={disabledValue ? disabledValue(value) : false}
            >
              {labelRenderer ? labelRenderer(value) : value}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function SelectIdValue<T extends { id: K }, K extends string>({
  values: values,
  onSelect,
  value,
  toLabel,
  placeholder,
  disabled,
  className
}: {
  values?: T[];
  value?: K;
  onSelect?: (value?: T) => void;
  toLabel?: (value: T) => React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [selected, setSelected] = React.useState<T | undefined>(
    values?.find(v => v.id === value)
  );

  useEffect(() => {
    setSelected(values?.find(v => v.id === value));
  }, [value, values]);

  return (
    <Select
      value={selected?.id}
      disabled={disabled}
      onValueChange={(id: string) => {
        setSelected(values?.find(v => v.id === id));
        onSelect && onSelect(values?.find(v => v.id === id));
      }}
    >
      <SelectTrigger className={cn("text-left", className)}>
        <SelectValue placeholder={placeholder ?? "Select value"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {values?.map(value => (
            <SelectItem key={value.id} value={value.id}>
              {toLabel ? toLabel(value) : value.id}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
