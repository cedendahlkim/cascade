# Task: gen-ds-reverse_with_stack-4910 | Score: 100% | 2026-02-14T13:25:51.533937

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))