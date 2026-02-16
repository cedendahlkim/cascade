# Task: gen-ds-reverse_with_stack-4081 | Score: 100% | 2026-02-13T19:24:10.161514

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))