# Task: gen-ds-reverse_with_stack-4035 | Score: 100% | 2026-02-13T09:34:14.370638

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))