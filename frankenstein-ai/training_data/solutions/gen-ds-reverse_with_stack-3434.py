# Task: gen-ds-reverse_with_stack-3434 | Score: 100% | 2026-02-14T12:05:22.970928

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))