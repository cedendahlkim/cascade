# Task: gen-ds-reverse_with_stack-6451 | Score: 100% | 2026-02-13T12:21:52.060602

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))