# Generated by Django 2.2.13 on 2020-07-11 19:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_auto_20200710_1034'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='paymnet_succeeded',
            field=models.BooleanField(default=False),
        ),
    ]