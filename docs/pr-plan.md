# Incremental PR Plan

Goal: maximize consistent, showcaseable daily activity with focused PRs.

## PR slicing rules

- Keep PRs small (prefer 1 logical change per PR).
- Include a clear title, scope, and acceptance criteria.
- Avoid mixing backend, frontend, and infra changes unless necessary.

## Proposed PR backlog

1. **Planning docs**  
   Add roadmap and PR strategy documents.

2. **.NET solution scaffold**  
   Add solution and API project skeleton.

3. **Health endpoint**  
   Add `/health` endpoint and run verification.

4. **PokeAPI client contract**  
   Add interfaces and DTOs for integration boundary.

5. **PokeAPI implementation**  
   Implement one service call and mapping.

6. **Backend Pokémon endpoint**  
   Expose normalized Pokémon response from backend.

7. **Vue scaffold**  
   Create Vue app structure and base page.

8. **Frontend API integration**  
   Wire Vue service to backend Pokémon endpoint.

9. **UX improvements**  
   Add loading, empty, and error states.

10. **Testing increments**  
    Add targeted tests per newly introduced behavior.

## Definition of done per PR

- Scope is limited and reviewable.
- Basic validation for the touched area is complete.
- Documentation is updated when behavior/design changes.






