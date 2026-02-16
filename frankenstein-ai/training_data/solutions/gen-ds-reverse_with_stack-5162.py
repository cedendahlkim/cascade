# Task: gen-ds-reverse_with_stack-5162 | Score: 100% | 2026-02-14T13:12:31.245013

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))