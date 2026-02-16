# Task: gen-ds-reverse_with_stack-6390 | Score: 100% | 2026-02-13T18:23:57.083119

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))