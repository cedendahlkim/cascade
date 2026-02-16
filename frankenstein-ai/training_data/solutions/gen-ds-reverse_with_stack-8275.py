# Task: gen-ds-reverse_with_stack-8275 | Score: 100% | 2026-02-13T15:11:15.961173

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))