# Task: gen-ds-reverse_with_stack-7773 | Score: 100% | 2026-02-15T08:48:49.629050

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))