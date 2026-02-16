# Task: gen-ds-reverse_with_stack-4526 | Score: 100% | 2026-02-13T15:46:37.167172

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))