# Task: gen-ds-reverse_with_stack-5606 | Score: 100% | 2026-02-15T08:48:50.781901

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))