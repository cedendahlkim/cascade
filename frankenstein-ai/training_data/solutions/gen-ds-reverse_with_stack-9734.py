# Task: gen-ds-reverse_with_stack-9734 | Score: 100% | 2026-02-13T18:29:22.199135

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))