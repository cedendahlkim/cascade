# Task: gen-ds-reverse_with_stack-3884 | Score: 100% | 2026-02-14T12:48:29.156596

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))