# Task: gen-ds-reverse_with_stack-5232 | Score: 100% | 2026-02-13T15:28:34.838833

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))