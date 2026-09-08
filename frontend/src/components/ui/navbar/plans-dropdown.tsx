import { PlanPrice } from '../../landing/plans-page/plan-price'
import { PlanComparison } from '../../landing/plans-page/plan-comparision'
import { NavDropdownPanel } from './nav-dropdown-panel'

export function PlansDropdown({ open }: { open: boolean }) {
  return (
    <NavDropdownPanel open={open}>
      <PlanPrice />
      <PlanComparison />
    </NavDropdownPanel>
  )
}
