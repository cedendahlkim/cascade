# Task: gen-ds-reverse_with_stack-1958 | Score: 100% | 2026-02-13T20:49:46.241588

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))