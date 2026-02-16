# Task: gen-ds-reverse_with_stack-1271 | Score: 100% | 2026-02-13T19:06:11.469721

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))