# Task: gen-ds-reverse_with_stack-4304 | Score: 100% | 2026-02-13T13:46:40.989737

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))