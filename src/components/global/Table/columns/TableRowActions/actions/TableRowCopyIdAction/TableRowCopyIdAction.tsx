import React from "react";

import TableRowCopyValueAction from "../TableRowCopyValueAction/TableRowCopyValueAction";
import { TableRowCopyIdActionProps as Props } from "./TableRowCopyIdAction.types";

const TableRowCopyIdAction = (props: Props) => {
  const { id, ...restProps } = props;
  return <TableRowCopyValueAction value={id} name="ID" {...restProps} />;
};

export default TableRowCopyIdAction;
