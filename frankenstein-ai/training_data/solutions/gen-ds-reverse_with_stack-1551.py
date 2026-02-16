# Task: gen-ds-reverse_with_stack-1551 | Score: 100% | 2026-02-15T09:34:17.508370

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))