# Task: gen-ds-reverse_with_stack-2822 | Score: 100% | 2026-02-15T07:49:42.386265

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))