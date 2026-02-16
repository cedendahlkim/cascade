# Task: gen-ds-reverse_with_stack-3661 | Score: 100% | 2026-02-15T13:29:52.269743

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))