# Task: gen-ds-reverse_with_stack-9903 | Score: 100% | 2026-02-13T20:17:09.656014

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))