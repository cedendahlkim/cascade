# Task: gen-ds-reverse_with_stack-8306 | Score: 100% | 2026-02-14T13:11:47.947164

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))