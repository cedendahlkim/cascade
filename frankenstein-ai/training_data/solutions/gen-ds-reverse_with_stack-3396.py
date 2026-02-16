# Task: gen-ds-reverse_with_stack-3396 | Score: 100% | 2026-02-14T12:08:06.110014

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))