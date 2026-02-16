# Task: gen-ds-reverse_with_stack-6777 | Score: 100% | 2026-02-13T09:13:13.202890

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))