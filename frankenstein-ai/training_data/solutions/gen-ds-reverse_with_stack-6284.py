# Task: gen-ds-reverse_with_stack-6284 | Score: 100% | 2026-02-13T13:11:44.893232

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))