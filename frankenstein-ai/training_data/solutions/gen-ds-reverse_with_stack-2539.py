# Task: gen-ds-reverse_with_stack-2539 | Score: 100% | 2026-02-15T08:05:18.783022

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))