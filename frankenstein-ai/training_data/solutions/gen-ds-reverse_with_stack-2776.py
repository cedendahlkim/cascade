# Task: gen-ds-reverse_with_stack-2776 | Score: 100% | 2026-02-13T14:09:05.678689

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))