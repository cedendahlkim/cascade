# Task: gen-ds-reverse_with_stack-4224 | Score: 100% | 2026-02-15T11:12:17.396009

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))