# Task: gen-ds-reverse_with_stack-5641 | Score: 100% | 2026-02-15T07:52:47.124031

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))