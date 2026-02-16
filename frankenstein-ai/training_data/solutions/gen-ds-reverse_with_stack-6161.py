# Task: gen-ds-reverse_with_stack-6161 | Score: 100% | 2026-02-15T08:15:00.511386

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))