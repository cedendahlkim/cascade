# Task: gen-ds-reverse_with_stack-3431 | Score: 100% | 2026-02-15T08:48:31.898389

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))