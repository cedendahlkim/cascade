# Task: gen-ds-reverse_with_stack-4161 | Score: 100% | 2026-02-14T12:27:42.662540

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))