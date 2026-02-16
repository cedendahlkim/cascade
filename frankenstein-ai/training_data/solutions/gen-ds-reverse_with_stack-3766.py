# Task: gen-ds-reverse_with_stack-3766 | Score: 100% | 2026-02-15T13:59:38.131768

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))