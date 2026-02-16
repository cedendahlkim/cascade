# Task: gen-ds-reverse_with_stack-3687 | Score: 100% | 2026-02-15T07:59:15.392350

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))