# Task: gen-ds-reverse_with_stack-6529 | Score: 100% | 2026-02-13T20:17:10.778628

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))