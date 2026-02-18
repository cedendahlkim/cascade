# Task: gen-ds-reverse_with_stack-8589 | Score: 100% | 2026-02-17T20:35:05.455049

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))