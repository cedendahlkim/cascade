# Task: gen-ds-reverse_with_stack-5698 | Score: 100% | 2026-02-13T19:06:10.505192

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))