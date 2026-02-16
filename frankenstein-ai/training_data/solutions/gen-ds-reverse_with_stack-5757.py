# Task: gen-ds-reverse_with_stack-5757 | Score: 100% | 2026-02-13T13:41:55.821557

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))