# Task: gen-ds-reverse_with_stack-1475 | Score: 100% | 2026-02-13T19:06:18.837355

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))