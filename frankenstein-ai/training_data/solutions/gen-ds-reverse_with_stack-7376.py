# Task: gen-ds-reverse_with_stack-7376 | Score: 100% | 2026-02-13T17:36:20.363312

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))