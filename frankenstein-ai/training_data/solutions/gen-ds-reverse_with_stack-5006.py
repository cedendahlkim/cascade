# Task: gen-ds-reverse_with_stack-5006 | Score: 100% | 2026-02-13T20:02:24.159405

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))