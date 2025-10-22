/**
 * Type declarations for react-icons to fix React 18 TypeScript compatibility
 * This resolves the "cannot be used as a JSX component" error
 */

declare module "react-icons/md" {
  import { IconType } from "react-icons";

  export const MdArrowBack: IconType;
  export const MdAssignment: IconType;
  export const MdCheckCircle: IconType;
  export const MdCancel: IconType;
  export const MdSpeed: IconType;
  export const MdSearch: IconType;
  export const MdFilterList: IconType;
  export const MdCalendarToday: IconType;
  export const MdRefresh: IconType;
  export const MdPictureAsPdf: IconType;
  export const MdDelete: IconType;
  export const MdFireTruck: IconType;
  export const MdPerson: IconType;
  export const MdLocationOn: IconType;
  export const MdAccessTime: IconType;
  export const MdWarning: IconType;
  export const MdNavigateBefore: IconType;
  export const MdNavigateNext: IconType;
  export const MdClose: IconType;
  export const MdHistory: IconType;
  export const MdLocalHospital: IconType;
}

declare module "react-icons" {
  import { ComponentType, SVGAttributes } from "react";

  export interface IconBaseProps extends SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }

  export type IconType = ComponentType<IconBaseProps>;
}
