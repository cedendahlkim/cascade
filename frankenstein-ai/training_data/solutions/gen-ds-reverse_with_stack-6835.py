# Task: gen-ds-reverse_with_stack-6835 | Score: 100% | 2026-02-14T12:59:55.693160

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))